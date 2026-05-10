---
read_when:
    - 正在处理遥测 / 隐私控制
    - 关于会收集哪些数据的问题
summary: 通过 `clawhub sync` + 选择退出机制收集安装遥测。
x-i18n:
    generated_at: "2026-05-10T19:26:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# 遥测

ClawHub 使用**最少量遥测**来计算**安装计数**（实际正在使用的内容），并支持更好的排序/筛选。
这基于 CLI `clawhub sync` 命令。

## 何时收集遥测

仅在以下情况下发送遥测：

- 你已在 CLI 中**登录**（我们已经要求同步/发布流程进行认证）。
- 你运行 `clawhub sync`。
- 遥测**未被禁用**（见下方“如何禁用”）。

如果你未登录，不会报告任何内容。

## 我们收集什么

每次运行 `clawhub sync` 时，CLI 都会报告它找到的内容的**完整快照**，按扫描根目录（“文件夹/根目录”）分组。

对于每个根目录，我们存储：

- `rootId`：规范根路径的 **SHA-256 哈希**（服务器永远看不到原始路径）。
- `label`：从最后两个路径段派生的人类可读标签（主目录路径会显示为 `~`）。
- `firstSeenAt`、`lastSeenAt`、可选的 `expiredAt`。

对于在根目录下找到的每个 Skills，我们存储：

- `skillId`（通过 slug 解析；只跟踪注册表中存在的 Skills）。
- `firstSeenAt`、`lastSeenAt`。
- `lastVersion`（尽力而为；目前如果已知，则为注册表匹配的版本）。
- 当先前报告的安装从某个根目录消失时，可选的 `removedAt`。

### 我们_不_收集什么

- 不收集原始绝对文件夹路径（仅收集经过哈希的 `rootId` + 简短显示标签）。
- 不收集文件内容。
- 不收集每次运行的日志、提示词或其他 CLI 输出。
- 不跟踪未上传到注册表的 Skills（未知 slug 会被忽略）。

## 安装计数

我们为每个 Skills 维护两个计数器：

- `installsCurrent`：当前至少在一个活跃根目录中安装了该 Skills 的唯一用户数。
- `installsAllTime`：曾经报告安装过该 Skills 的唯一用户数。

### 多个根目录

如果你从多个文件夹同步，我们会独立处理每个扫描根目录。只要某个 Skills 存在于**任意**活跃根目录中，就视为“当前已安装”。

### 卸载检测

由于 `sync` 会报告每个根目录下的完整集合：

- 如果某个 Skills 在下一次同步时从某个根目录消失，我们会将它标记为已从该根目录移除。
- 如果该 Skills 已从你的所有根目录中移除，它将不再计入 `installsCurrent`。
- 除非你删除遥测（见下文），否则 `installsAllTime` 永不减少。

### 过期（120 天）

如果根目录连续 **120 天**未报告遥测，则会被标记为过期，其安装将停止计入 `installsCurrent`。
为避免后台任务，这会以惰性方式评估（在下一次遥测报告时）。

## 透明度 + 用户控制

ClawHub 在你的个人资料中提供私有“已安装”标签页：

- 显示我们存储的确切根目录 + 已安装 Skills。
- 包含 **JSON 导出**视图。
- 包含**删除遥测**操作，用于移除你账户的所有已存储遥测。

其他所有人只能看到**聚合安装计数器**；其他任何人都看不到你的根目录/文件夹。

删除你的账户也会删除你的遥测数据。

## 如何禁用遥测

设置环境变量：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

设置后，CLI 在运行 `clawhub sync` 期间不会发送遥测。
