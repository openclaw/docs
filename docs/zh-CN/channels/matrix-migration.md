---
read_when:
    - 升级现有 Matrix 安装
    - 迁移已加密的 Matrix 历史记录和设备状态
summary: OpenClaw 如何原地升级旧版 Matrix 插件，包括加密状态恢复限制和手动恢复步骤。
title: Matrix 迁移
x-i18n:
    generated_at: "2026-07-12T14:19:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 33d5ac134338c8032ca1507ceee6eade2d37b3c86f0045fb883304ad208cd5e5
    source_path: channels/matrix-migration.md
    workflow: 16
---

从先前公开的 `matrix` 插件升级到当前实现。

对于大多数用户，升级可直接进行：

- 插件仍为 `@openclaw/matrix`
- 渠道仍为 `matrix`
- 你的配置仍位于 `channels.matrix` 下
- 缓存的凭据仍位于 `~/.openclaw/credentials/matrix/` 下
- 运行时状态仍位于 `~/.openclaw/matrix/` 下

你不需要重命名配置键，也不需要用新名称重新安装插件。
根 `openclaw` 包不再内置 Matrix 运行时代码或 Matrix SDK
依赖项。如果 `openclaw channels status` 显示 Matrix 已配置，但
插件尚未安装，请运行 `openclaw doctor --fix` 或
`openclaw plugins install @openclaw/matrix`；不要将 Matrix SDK 包
安装到根 OpenClaw 包中。

## 迁移会自动执行的操作

运行 [`openclaw doctor --fix`](/zh-CN/gateway/doctor) 时会执行 Matrix 迁移；如果 Matrix 客户端启动时仍在其 SQLite 存储旁发现基于文件的辅助状态，也会将迁移作为后备措施执行。

自动迁移包括：

- 复用缓存的 Matrix 凭据
- 保持相同的账户选择和 `channels.matrix` 配置
- 将基于文件的辅助状态（`bot-storage.json` 同步缓存、`recovery-key.json`、`legacy-crypto-migration.json`、IndexedDB 快照）导入 Matrix SQLite 状态；迁移后的文件会以 `.migrated` 后缀归档
- 当访问令牌之后发生变化时，为同一 Matrix 账户、homeserver、用户和设备复用现有数据最完整的令牌哈希存储根目录

## 从早于 2026.4 的 OpenClaw 版本升级

截至 2026.6 系列的版本还会迁移最初的扁平单存储
Matrix 布局（`~/.openclaw/matrix/bot-storage.json` 加上
`~/.openclaw/matrix/crypto/`），并准备从旧版 rust 加密存储中恢复加密状态。当前版本已不再包含该迁移。

如果你要升级的安装仍使用扁平布局，请先
升级到 2026.6 版本，运行 `openclaw doctor --fix`，并启动一次 Gateway 网关，
以迁移扁平存储和所有可恢复的房间密钥。然后再更新
到最新版本。

先前公开的 Matrix 插件**不会**自动创建 Matrix 房间密钥备份。如果旧安装中存在从未备份、仅保存在本地的加密历史记录，那么无论采用哪种迁移路径，升级后部分较早的加密消息都可能仍然无法读取。

## 推荐的升级流程

1. 正常更新 OpenClaw 和 Matrix 插件。
2. 运行：

   ```bash
   openclaw doctor --fix
   ```

3. 启动或重启 Gateway 网关。
4. 检查当前的验证和备份状态：

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. 将你要修复的 Matrix 账户的恢复密钥放入账户专用的环境变量中。对于单个默认账户，使用 `MATRIX_RECOVERY_KEY` 即可。对于多个账户，每个账户使用一个变量，例如 `MATRIX_RECOVERY_KEY_ASSISTANT`，并在命令中添加 `--account assistant`。

6. 如果 OpenClaw 提示需要恢复密钥，请为对应账户运行命令：

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. 如果此设备仍未验证，请为对应账户运行命令：

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   如果恢复密钥已被接受且备份可用，但 `Cross-signing verified`
   仍为 `no`，请通过另一个 Matrix 客户端完成自验证：

   ```bash
   openclaw matrix verify self
   ```

   在另一个 Matrix 客户端中接受请求，比较表情符号或十进制数字，
   仅当它们匹配时才输入 `yes`。该命令会等待 Matrix
   身份获得完全信任后再报告成功。

8. 如果你有意放弃无法恢复的旧历史记录，并希望为未来的消息创建新的备份基准，请运行：

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   仅当旧恢复密钥不应再能解锁新备份时，才添加 `--rotate-recovery-key`。

9. 如果服务器端尚不存在密钥备份，请创建一个，以供将来恢复：

   ```bash
   openclaw matrix verify bootstrap
   ```

## 常见消息及其含义

`Failed migrating legacy Matrix client storage: ...`

- 含义：Matrix 客户端侧的后备措施发现了基于文件的辅助状态，但导入 SQLite 失败。OpenClaw 会回滚已完成的移动操作并中止该后备流程，而不是在不提示的情况下使用全新存储启动。
- 处理方法：检查文件系统权限或冲突，保持旧状态不变，并在修复错误后重试。

`Matrix is installed from a custom path: ...`

- 含义：Matrix 固定使用路径安装，因此主线更新不会自动将其替换为默认的 Matrix 包。
- 处理方法：如果你希望恢复使用默认 Matrix 插件，请使用 `openclaw plugins install @openclaw/matrix` 重新安装。

`Matrix is installed from a custom path that no longer exists: ...`

- 含义：你的插件安装记录指向一个已不存在的本地路径。
- 处理方法：使用 `openclaw plugins install @openclaw/matrix` 重新安装；如果你从仓库检出目录运行，请使用 `openclaw plugins install ./path/to/local/matrix-plugin`。`openclaw doctor --fix` 也可以为你移除过时的 Matrix 插件引用。

### 手动恢复消息

当此设备上的房间密钥备份状态异常时，`openclaw matrix verify status` 和 `openclaw matrix verify backup status` 会输出一行 `Backup issue:`，以及 `Next steps:` 指引：

| 备份问题                                                              | 含义                                               | 修复方法                                                                                                                                  |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | 没有可供恢复的内容                                 | 使用 `openclaw matrix verify bootstrap` 创建房间密钥备份                                                                                  |
| `backup decryption key is not loaded on this device`                  | 密钥存在，但尚未在此设备上启用                     | 运行 `openclaw matrix verify backup restore`；如果仍无法加载密钥，请通过 `--recovery-key-stdin` 传入恢复密钥                              |
| `backup decryption key could not be loaded from secret storage (...)` | 从机密存储加载失败或不受支持                       | 传入恢复密钥：`printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`                         |
| `backup key mismatch (...)`                                           | 存储的密钥与服务器上的当前备份不匹配               | 使用服务器当前备份密钥重新运行 `verify backup restore --recovery-key-stdin`，或运行 `verify backup reset --yes` 创建新的基准              |
| `backup signature chain is not trusted by this device`                | 设备尚不信任交叉签名链                             | 运行 `verify device --recovery-key-stdin`；如果信任仍不完整，再从另一个已验证的客户端运行 `verify self`                                  |
| `backup exists but is not active on this device`                      | 服务器上存在备份，但本地会话未启用                 | 先验证设备，然后使用 `openclaw matrix verify backup status` 重新检查                                                                      |
| `backup trust state could not be fully determined`                    | 诊断未得出明确结论                                 | `openclaw matrix verify status --verbose`                                                                                                 |

其他恢复错误：

`Matrix recovery key is required`

- 含义：你尝试执行需要恢复密钥的恢复步骤，但未提供恢复密钥。
- 处理方法：使用 `--recovery-key-stdin` 重新运行命令，例如 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

`Invalid Matrix recovery key: ...`

- 含义：无法解析提供的密钥，或该密钥与预期格式不匹配。
- 处理方法：使用 Matrix 客户端或恢复密钥导出中提供的确切恢复密钥重试。

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- 含义：恢复密钥解锁了可用的备份材料，但 Matrix 尚未为此设备建立完整的交叉签名身份信任。请检查命令输出中的 `Recovery key accepted`、`Backup usable`、`Cross-signing verified` 和 `Device verified by owner`。
- 处理方法：运行 `openclaw matrix verify self`，在另一个 Matrix 客户端中接受请求，比较 SAS，并且仅当其匹配时才输入 `yes`。仅当你有意替换当前的交叉签名身份时，才使用 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`。

如果你接受丢失无法恢复的旧加密历史记录，也可以改为使用
`openclaw matrix verify backup reset --yes` 重置当前备份基准。当
存储的备份机密损坏时，该重置还会修复机密存储，使
新备份密钥在重启后能够正确加载。

## 如果加密历史记录仍未恢复

按顺序运行以下检查：

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

如果备份已成功恢复，但部分旧房间中仍缺少历史记录，则这些缺失的密钥很可能从未被先前的插件备份。

## 如果你希望为未来消息重新开始

如果你接受丢失无法恢复的旧加密历史记录，并且只希望从现在开始使用干净的备份基准，请按顺序运行以下命令：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

如果之后设备仍未验证，请在 Matrix 客户端中比较 SAS 表情符号或十进制代码，并确认它们匹配，以完成验证。

## 相关内容

- [Matrix](/zh-CN/channels/matrix)：渠道设置和配置。
- [Matrix 推送规则](/zh-CN/channels/matrix-push-rules)：通知路由。
- [Doctor](/zh-CN/gateway/doctor)：健康检查和自动迁移触发器。
- [迁移指南](/zh-CN/install/migrating)：所有迁移路径（计算机迁移、跨系统导入）。
- [插件](/zh-CN/tools/plugin)：插件安装和注册。
