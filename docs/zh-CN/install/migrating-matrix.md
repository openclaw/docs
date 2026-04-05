---
read_when:
    - 升级现有的 Matrix 安装
    - 迁移加密的 Matrix 历史记录和设备状态
summary: OpenClaw 如何原地升级旧版 Matrix 插件，包括加密状态恢复限制和手动恢复步骤。
title: Matrix 迁移
x-i18n:
    generated_at: "2026-04-05T08:28:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b1ade057d90a524e09756bd981921988c980ea6259f5c4316a796a831e9f83b
    source_path: install/migrating-matrix.md
    workflow: 15
---

# Matrix 迁移

本页面介绍如何从之前公开的 `matrix` 插件升级到当前实现。

对于大多数用户，升级是原地进行的：

- 插件仍然是 `@openclaw/matrix`
- 渠道仍然是 `matrix`
- 你的配置仍保存在 `channels.matrix` 下
- 缓存的凭证仍保存在 `~/.openclaw/credentials/matrix/` 下
- 运行时状态仍保存在 `~/.openclaw/matrix/` 下

你不需要重命名配置键，也不需要用新名称重新安装插件。

## 迁移会自动完成的内容

当 Gateway 网关启动时，以及当你运行 [`openclaw doctor --fix`](/gateway/doctor) 时，OpenClaw 会尝试自动修复旧的 Matrix 状态。
在任何可执行的 Matrix 迁移步骤修改磁盘状态之前，OpenClaw 都会创建或复用一个聚焦的恢复快照。

当你使用 `openclaw update` 时，具体触发方式取决于 OpenClaw 的安装方式：

- 源码安装会在更新流程中运行 `openclaw doctor --fix`，然后默认重启 Gateway 网关
- 包管理器安装会更新软件包，运行一次非交互式 Doctor 检查，然后依赖默认的 Gateway 网关重启，以便在启动时完成 Matrix 迁移
- 如果你使用 `openclaw update --no-restart`，则基于启动的 Matrix 迁移会被推迟，直到你稍后运行 `openclaw doctor --fix` 并重启 Gateway 网关

自动迁移包括：

- 在 `~/Backups/openclaw-migrations/` 下创建或复用一个迁移前快照
- 复用你缓存的 Matrix 凭证
- 保持相同的账号选择和 `channels.matrix` 配置
- 将最旧的扁平 Matrix 同步存储移动到当前的按账号划分位置
- 当可以安全解析目标账号时，将最旧的扁平 Matrix 加密存储移动到当前的按账号划分位置
- 当旧的 Rust 加密存储中本地存在该密钥时，提取之前保存的 Matrix 房间密钥备份解密密钥
- 当访问令牌稍后发生变化时，为同一个 Matrix 账号、homeserver 和用户复用最完整的现有 token-hash 存储根目录
- 当 Matrix 访问令牌发生变化但账号/设备身份保持不变时，扫描同级 token-hash 存储根目录中待恢复的加密状态元数据
- 在下一次 Matrix 启动时，将已备份的房间密钥恢复到新的加密存储中

快照详情：

- 成功创建快照后，OpenClaw 会在 `~/.openclaw/matrix/migration-snapshot.json` 写入一个标记文件，以便后续启动和修复过程复用同一个归档文件。
- 这些自动 Matrix 迁移快照只备份配置 + 状态（`includeWorkspace: false`）。
- 如果 Matrix 只有仅警告型迁移状态，例如因为 `userId` 或 `accessToken` 仍然缺失，OpenClaw 暂时不会创建快照，因为此时没有可执行的 Matrix 修改。
- 如果快照步骤失败，OpenClaw 会跳过本次运行中的 Matrix 迁移，而不会在没有恢复点的情况下修改状态。

关于多账号升级：

- 最旧的扁平 Matrix 存储（`~/.openclaw/matrix/bot-storage.json` 和 `~/.openclaw/matrix/crypto/`）来自单一存储布局，因此 OpenClaw 只能将其迁移到一个已解析的 Matrix 账号目标中
- 已经是按账号划分的旧版 Matrix 存储会按每个已配置的 Matrix 账号进行检测和准备

## 迁移无法自动完成的内容

之前公开的 Matrix 插件**不会**自动创建 Matrix 房间密钥备份。它会持久化本地加密状态并请求设备验证，但它不能保证你的房间密钥已经备份到 homeserver。

这意味着某些加密安装只能部分迁移。

OpenClaw 无法自动恢复以下内容：

- 从未备份过、仅存在于本地的房间密钥
- 当目标 Matrix 账号尚无法解析时的加密状态，因为 `homeserver`、`userId` 或 `accessToken` 仍不可用
- 当配置了多个 Matrix 账号但未设置 `channels.matrix.defaultAccount` 时，对单个共享扁平 Matrix 存储的自动迁移
- 固定到仓库路径而不是标准 Matrix 软件包的自定义插件路径安装
- 当旧存储具有已备份密钥但未在本地保留解密密钥时，缺失的恢复密钥

当前警告范围：

- 自定义 Matrix 插件路径安装会在 Gateway 网关启动和 `openclaw doctor` 中同时提示

如果你的旧安装包含从未备份过的仅本地加密历史，那么升级后某些较旧的加密消息可能仍然无法读取。

## 推荐的升级流程

1. 正常更新 OpenClaw 和 Matrix 插件。
   建议直接使用不带 `--no-restart` 的 `openclaw update`，这样启动时就能立即完成 Matrix 迁移。
2. 运行：

   ```bash
   openclaw doctor --fix
   ```

   如果 Matrix 存在可执行的迁移工作，Doctor 会先创建或复用迁移前快照，并打印归档路径。

3. 启动或重启 Gateway 网关。
4. 检查当前验证和备份状态：

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. 如果 OpenClaw 告诉你需要恢复密钥，请运行：

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. 如果此设备仍未验证，请运行：

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

7. 如果你打算放弃无法恢复的旧历史，并希望为未来消息建立新的备份基线，请运行：

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. 如果尚不存在服务器端密钥备份，请为未来恢复创建一个：

   ```bash
   openclaw matrix verify bootstrap
   ```

## 加密迁移的工作方式

加密迁移是一个两阶段过程：

1. 如果加密迁移可执行，则启动过程或 `openclaw doctor --fix` 会创建或复用迁移前快照。
2. 启动过程或 `openclaw doctor --fix` 会通过当前活动的 Matrix 插件安装检查旧的 Matrix 加密存储。
3. 如果找到备份解密密钥，OpenClaw 会将其写入新的恢复密钥流程，并将房间密钥恢复标记为待处理。
4. 在下一次 Matrix 启动时，OpenClaw 会自动将已备份的房间密钥恢复到新的加密存储中。

如果旧存储报告存在从未备份过的房间密钥，OpenClaw 会发出警告，而不会假装恢复已经成功。

## 常见消息及其含义

### 升级和检测消息

`Matrix plugin upgraded in place.`

- 含义：已检测到旧的磁盘 Matrix 状态，并已将其迁移到当前布局。
- 该怎么做：除非同一输出中还包含警告，否则无需操作。

`Matrix migration snapshot created before applying Matrix upgrades.`

- 含义：OpenClaw 在修改 Matrix 状态前创建了恢复归档。
- 该怎么做：在确认迁移成功之前，请保留输出的归档路径。

`Matrix migration snapshot reused before applying Matrix upgrades.`

- 含义：OpenClaw 找到了现有的 Matrix 迁移快照标记，并复用了该归档，而不是创建重复备份。
- 该怎么做：在确认迁移成功之前，请保留输出的归档路径。

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- 含义：检测到了旧的 Matrix 状态，但由于 Matrix 尚未配置，OpenClaw 无法将其映射到当前 Matrix 账号。
- 该怎么做：配置 `channels.matrix`，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 含义：OpenClaw 找到了旧状态，但仍无法确定确切的当前账号/设备根。
- 该怎么做：先使用有效的 Matrix 登录启动一次 Gateway 网关，或在缓存凭证存在后重新运行 `openclaw doctor --fix`。

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 含义：OpenClaw 找到了一个共享的扁平 Matrix 存储，但拒绝猜测应将它分配给哪个具名 Matrix 账号。
- 该怎么做：将 `channels.matrix.defaultAccount` 设置为目标账号，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Matrix legacy sync store not migrated because the target already exists (...)`

- 含义：新的按账号划分位置已经有同步或加密存储，因此 OpenClaw 不会自动覆盖它。
- 该怎么做：先确认当前账号是正确的目标账号，再手动删除或移动冲突目标。

`Failed migrating Matrix legacy sync store (...)` 或 `Failed migrating Matrix legacy crypto store (...)`

- 含义：OpenClaw 尝试移动旧的 Matrix 状态，但文件系统操作失败了。
- 该怎么做：检查文件系统权限和磁盘状态，然后重新运行 `openclaw doctor --fix`。

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- 含义：OpenClaw 找到了旧的加密 Matrix 存储，但当前没有可附加它的 Matrix 配置。
- 该怎么做：配置 `channels.matrix`，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 含义：加密存储存在，但 OpenClaw 无法安全判断它属于哪个当前账号/设备。
- 该怎么做：先使用有效的 Matrix 登录启动一次 Gateway 网关，或在缓存凭证可用后重新运行 `openclaw doctor --fix`。

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 含义：OpenClaw 找到了一个共享的扁平旧版加密存储，但拒绝猜测应将它分配给哪个具名 Matrix 账号。
- 该怎么做：将 `channels.matrix.defaultAccount` 设置为目标账号，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- 含义：OpenClaw 检测到了旧的 Matrix 状态，但迁移仍受缺失身份或凭证数据阻塞。
- 该怎么做：完成 Matrix 登录或配置设置，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- 含义：OpenClaw 找到了旧的加密 Matrix 状态，但它无法从 Matrix 插件中加载通常用于检查该存储的辅助入口点。
- 该怎么做：重新安装或修复 Matrix 插件（`openclaw plugins install @openclaw/matrix`，或者对于仓库检出，使用 `openclaw plugins install ./path/to/local/matrix-plugin`），然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- 含义：OpenClaw 发现了一个逃逸插件根目录或未通过插件边界检查的辅助文件路径，因此拒绝导入它。
- 该怎么做：从可信路径重新安装 Matrix 插件，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- 含义：OpenClaw 拒绝修改 Matrix 状态，因为它无法先创建恢复快照。
- 该怎么做：解决备份错误，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Failed migrating legacy Matrix client storage: ...`

- 含义：Matrix 客户端侧回退检测到了旧的扁平存储，但移动失败了。OpenClaw 现在会中止该回退，而不是静默地使用新存储启动。
- 该怎么做：检查文件系统权限或冲突，保持旧状态完好无损，并在修复错误后重试。

`Matrix is installed from a custom path: ...`

- 含义：Matrix 被固定为路径安装，因此主线更新不会自动将其替换为仓库的标准 Matrix 软件包。
- 该怎么做：当你希望回到默认 Matrix 插件时，使用 `openclaw plugins install @openclaw/matrix` 重新安装。

### 加密状态恢复消息

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- 含义：已成功将备份的房间密钥恢复到新的加密存储中。
- 该怎么做：通常无需操作。

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- 含义：某些旧房间密钥仅存在于旧的本地存储中，从未上传到 Matrix 备份。
- 该怎么做：除非你能从另一个已验证客户端手动恢复这些密钥，否则请预期某些旧的加密历史仍不可用。

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- 含义：备份存在，但 OpenClaw 无法自动恢复恢复密钥。
- 该怎么做：运行 `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`。

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- 含义：OpenClaw 找到了旧的加密存储，但无法足够安全地检查它以准备恢复。
- 该怎么做：重新运行 `openclaw doctor --fix`。如果仍然重复出现，请保持旧状态目录不变，并使用另一个已验证的 Matrix 客户端加上 `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` 进行恢复。

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- 含义：OpenClaw 检测到备份密钥冲突，并拒绝自动覆盖当前的 recovery-key 文件。
- 该怎么做：在重试任何恢复命令之前，先确认哪个恢复密钥是正确的。

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- 含义：这是旧存储格式的硬性限制。
- 该怎么做：已备份的密钥仍可恢复，但仅本地存在的加密历史可能仍不可用。

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- 含义：新插件尝试恢复时，Matrix 返回了错误。
- 该怎么做：运行 `openclaw matrix verify backup status`，然后在需要时使用 `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` 重试。

### 手动恢复消息

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- 含义：OpenClaw 知道你应该有备份密钥，但该密钥当前未在此设备上激活。
- 该怎么做：运行 `openclaw matrix verify backup restore`，或在需要时传入 `--recovery-key`。

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- 含义：此设备当前尚未存储恢复密钥。
- 该怎么做：先使用你的恢复密钥验证该设备，然后恢复备份。

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- 含义：存储的密钥与当前活动的 Matrix 备份不匹配。
- 该怎么做：使用正确的密钥重新运行 `openclaw matrix verify device "<your-recovery-key>"`。

如果你接受丢失无法恢复的旧加密历史，也可以使用 `openclaw matrix verify backup reset --yes` 重置当前备份基线。当存储的备份密钥损坏时，该重置还可能重建秘密存储，以便新的备份密钥在重启后能够正确加载。

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- 含义：备份存在，但此设备尚未足够强地信任跨签名链。
- 该怎么做：重新运行 `openclaw matrix verify device "<your-recovery-key>"`。

`Matrix recovery key is required`

- 含义：你在未提供恢复密钥的情况下尝试执行需要恢复密钥的恢复步骤。
- 该怎么做：使用你的恢复密钥重新运行该命令。

`Invalid Matrix recovery key: ...`

- 含义：提供的密钥无法解析，或与预期格式不匹配。
- 该怎么做：使用来自你的 Matrix 客户端或 recovery-key 文件中的精确恢复密钥重试。

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- 含义：密钥已应用，但设备仍无法完成验证。
- 该怎么做：确认你使用的是正确密钥，并确认账号上可用跨签名，然后重试。

`Matrix key backup is not active on this device after loading from secret storage.`

- 含义：秘密存储未能在此设备上生成一个活动备份会话。
- 该怎么做：先验证设备，然后使用 `openclaw matrix verify backup status` 再次检查。

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- 含义：在完成设备验证之前，此设备无法从秘密存储恢复。
- 该怎么做：先运行 `openclaw matrix verify device "<your-recovery-key>"`。

### 自定义插件安装消息

`Matrix is installed from a custom path that no longer exists: ...`

- 含义：你的插件安装记录指向一个已经不存在的本地路径。
- 该怎么做：使用 `openclaw plugins install @openclaw/matrix` 重新安装，或者如果你是从仓库检出运行，则使用 `openclaw plugins install ./path/to/local/matrix-plugin`。

## 如果加密历史仍然没有恢复

请按顺序运行以下检查：

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

如果备份恢复成功，但某些旧房间仍然缺少历史记录，那么这些缺失的密钥很可能从未被之前的插件备份过。

## 如果你想为未来消息重新开始

如果你接受丢失无法恢复的旧加密历史，并且只希望为未来消息建立一个干净的备份基线，请按顺序运行以下命令：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

如果此后设备仍未验证，请在你的 Matrix 客户端中通过比对 SAS emoji 或十进制代码并确认一致来完成验证。

## 相关页面

- [Matrix](/channels/matrix)
- [Doctor](/gateway/doctor)
- [迁移](/install/migrating)
- [插件](/tools/plugin)
